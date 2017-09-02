class Edge
{
    constructor(from, to)
    {
        this.from = from;
        this.to = to;
        // this.paths = [];
    }

    UpdatePath()
    {
        // let svg = this.svg;
        // let group = this.group;
        //
        // for(let i=0; i < this.paths.length; ++i) {
        //     this.paths[i].remove();
        // }
        // this.paths = [];
        //
        // let fr = this.from.RowInChart();
        // let tr = this.to.RowInChart();
        // let num_rows = Math.abs(fr-tr);
        //
        // let s = {
        //     x: TimeToPixels(this.from._end_ms),
        //     y: (GantTaskLayout.row_height) * (fr+0.5)
        // };
        // let e = {
        //     x: TimeToPixels(this.to._start_ms),
        //     y: (GantTaskLayout.row_height) * (tr+0.5)
        // };
        // let r = GantTaskLayout.row_height / 4;
        //
        // let x = Math.max(1, num_rows - 5);
        //
        // let going_down = s.y < e.y;
        // let ymul = going_down ? 1 : -1;
        //
        // this.paths.push (svg.path( group,
        //     svg .createPath()
        //         .move(s.x, s.y)
        //         .arc(r,r,180, false, going_down,  0, 2*ymul*r, true)
        //         .arc(r,r, 90, false,!going_down, -r,   ymul*r, true),
        //     {class:"edge"}
        // ));
        // this.paths.push (svg.path( group,
        //     svg .createPath()
        //         .move(s.x-r, s.y+3*ymul*r)
        //         .line(s.x-r, e.y-ymul*r),
        //     {class:"edge", opacity: 1.0 / x}
        // ));
        // this.paths.push (svg.path( group,
        //     svg .createPath()
        //         .move(s.x-r, e.y-ymul*r)
        //         .arc(r,r,90, false,!going_down, r, ymul*r, true)
        //         .line(e.x, e.y),
        //     {class:"edge"}
        // ));
    }
}
